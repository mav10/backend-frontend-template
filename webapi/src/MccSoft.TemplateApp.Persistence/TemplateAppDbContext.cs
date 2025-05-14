using Audit.EntityFramework;
using MccSoft.LowLevelPrimitives;
using MccSoft.PersistenceHelpers;
using MccSoft.TemplateApp.Domain;
using MccSoft.TemplateApp.Domain.Audit;
using MccSoft.TemplateApp.Domain.WebHook;
using MccSoft.WebHooks;
using MccSoft.WebHooks.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;
using Npgsql.TypeMapping;

namespace MccSoft.TemplateApp.Persistence;

public class TemplateAppDbContext
    :
    // DbContext
    IdentityDbContext<User>
{
    public IUserAccessor UserAccessor { get; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<DbFile> Files { get; set; }

    public TemplateAppDbContext(
        DbContextOptions<TemplateAppDbContext> options,
        IUserAccessor userAccessor
    )
        : base(options)
    {
        UserAccessor = userAccessor;
    }

    public static NpgsqlDbContextOptionsBuilder MapEnums(NpgsqlDbContextOptionsBuilder builder) =>
        builder.MapEnum<ProductType>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // if you already have some data in the table, which column you'd like to convert to enum
        // you'd need to adjust migration SQL to something like the following
        // migrationBuilder.Sql(
        // @"ALTER TABLE ""Patients"" ALTER COLUMN ""NumberSource"" TYPE number_source using (enum_range(null::number_source))[""NumberSource""::int + 1];"
        //     );
        // For details see https://github.com/mccsoft/backend-frontend-template/wiki/_new#migration-of-existing-data

        SetupQueryFilters(builder);

        /*
            Demonstrates how to register WebHook entities using a custom subscription type.
            If the default <see cref="WebHookSubscription"/> entity meets your requirements,
            you can simply register it as shown below:

            builder.AddWebHookEntities<WebHookSubscription>(GetType());

            Otherwise, provide your own type that inherits from WebHookSubscription,
            e.g. <see cref="TemplateWebHookSubscription"/>, to extend or override behavior.
        */
        builder.AddWebHookEntities<TemplateWebHookSubscription>(GetType());

        /*
            [Optional]
            We recommend placing WebHook-related entities in a separate schema
            (e.g. "webhooks") to keep them isolated from your main business logic tables.
        */
        builder.Entity<WebHook<TemplateWebHookSubscription>>().Metadata.SetSchema("webhooks");
        builder.Entity<TemplateWebHookSubscription>().Metadata.SetSchema("webhooks");
    }

    private void SetupQueryFilters(ModelBuilder builder)
    {
        builder.SetupQueryFilter<ITenantEntity>(
            x =>
                CurrentTenantIdForQueryFilter == null || x.TenantId == CurrentTenantIdForQueryFilter
        );
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        optionsBuilder.AddInterceptors(
            new PostProcessEntitiesOnSaveInterceptor<ITenantEntity, TemplateAppDbContext>(
                (entity, context) =>
                {
                    // We need this check, because sometimes we work through all tenants and manage TenantId manually.
                    // One of examples is new user creation, where there is no good place to
                    // wrap .SaveChanges with .SetCustomTenantId
                    if (entity.TenantId != 0)
                        return;

                    var currentTenantId = context.CurrentTenantId;
                    if (currentTenantId != null && currentTenantId != 0)
                    {
                        entity.SetTenantIdUnsafe(currentTenantId.Value);
                    }
                }
            )
        );

        optionsBuilder.AddInterceptors(new AuditSaveChangesInterceptor());
    }

    private int? CurrentTenantIdForQueryFilter =>
        CustomTenantIdAccessor.IsTenantIdQueryFilterDisabled ? null : CurrentTenantId;

    public int? CurrentTenantId =>
        UserAccessor.IsHttpContextAvailable
            ? UserAccessor.GetTenantId()
            : CustomTenantIdAccessor.GetCustomTenantId();
}
